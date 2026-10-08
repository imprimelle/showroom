#!/usr/bin/env python3
"""
Recadre les images produits AssoAI/Showroom au ratio 3:4 (0.75) pour qu'elles
remplissent les cadres 3:4 du site sans bandes ni recadrage à l'affichage.

Comportement :
- Lit tous les produits (main_image_url + gallery_images) via REST Supabase.
- Pour chaque image dont le ratio ≠ 3:4 (tolérance ±1%), fait un recadrage CENTRÉ
  au ratio 3:4, en conservant la résolution native (pas d'upscale).
- Upload l'image recadrée vers un NOUVEAU chemin (UUID) dans le bucket `images`
  (les originaux restent intacts dans le bucket).
- Met à jour products.main_image_url / gallery_images avec les nouvelles URLs.
- Sauvegarde : originaux téléchargés dans BACKUP_DIR + mapping de rollback.

Usage :
  python3 crop-images-34.py --dry-run   # prévisualise sans rien modifier
  python3 crop-images-34.py             # exécute réellement (upload + DB)
"""
import argparse
import io
import json
import os
import uuid

import requests
from PIL import Image

SUPA_URL = "https://yqioyfuxviiximembver.supabase.co"
BUCKET = "images"
SERVICE_ROLE_FILE = "/workspace/chat-flow-templates-main/.supabase-service-role"
TARGET_RATIO = 3 / 4  # 0.75
TOLERANCE = 0.01
JPEG_QUALITY = 90

BACKUP_DIR = "/tmp/showroom-image-backup"
ROLLBACK_FILE = "/tmp/showroom-rollback.json"
MAPPING_FILE = "/tmp/showroom-image-mapping.json"


def load_key() -> str:
    with open(SERVICE_ROLE_FILE) as f:
        return f.read().strip()


def fetch_products(headers: dict) -> list:
    r = requests.get(
        f"{SUPA_URL}/rest/v1/products",
        params={"select": "id,name,main_image_url,gallery_images", "is_published": "eq.true"},
        headers=headers,
        timeout=60,
    )
    r.raise_for_status()
    return r.json()


def download(url: str) -> bytes:
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    return r.content


def crop_to_ratio(im: Image.Image, target: float) -> Image.Image:
    """Recadrage centré au ratio `target` (largeur/hauteur)."""
    w, h = im.size
    ratio = w / h
    if abs(ratio - target) < TOLERANCE:
        return im
    if ratio > target:
        # trop large -> on rogne la largeur
        new_w = round(h * target)
        left = (w - new_w) // 2
        box = (left, 0, left + new_w, h)
    else:
        # trop haut -> on rogne la hauteur
        new_h = round(w / target)
        top = (h - new_h) // 2
        box = (0, top, w, top + new_h)
    return im.crop(box)


def upload(headers: dict, jpeg_bytes: bytes) -> str:
    path = f"public/{uuid.uuid4()}.jpg"
    r = requests.post(
        f"{SUPA_URL}/storage/v1/object/{BUCKET}/{path}",
        headers={**headers, "Content-Type": "image/jpeg", "x-upsert": "true"},
        data=jpeg_bytes,
        timeout=60,
    )
    r.raise_for_status()
    return f"{SUPA_URL}/storage/v1/object/public/{BUCKET}/{path}"


def process_image(url: str, headers: dict, dry_run: bool) -> dict:
    """Retourne {url, changed, ratio, w, h, nw, nh}."""
    raw = download(url)
    im = Image.open(io.BytesIO(raw))
    w, h = im.size
    ratio = w / h

    # sauvegarde locale de l'original (rollback de dernier recours)
    fname = url.rstrip("/").split("/")[-1]
    os.makedirs(BACKUP_DIR, exist_ok=True)
    with open(os.path.join(BACKUP_DIR, fname), "wb") as f:
        f.write(raw)

    if abs(ratio - TARGET_RATIO) < TOLERANCE:
        return {"url": url, "changed": False, "ratio": ratio, "w": w, "h": h, "nw": w, "nh": h}

    cropped = crop_to_ratio(im, TARGET_RATIO).convert("RGB")
    nw, nh = cropped.size

    if dry_run:
        return {"url": url, "changed": True, "ratio": ratio, "w": w, "h": h, "nw": nw, "nh": nh}

    buf = io.BytesIO()
    cropped.save(buf, format="JPEG", quality=JPEG_QUALITY)
    new_url = upload(headers, buf.getvalue())
    return {"url": new_url, "changed": True, "ratio": ratio, "w": w, "h": h, "nw": nw, "nh": nh}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="Prévisualise sans upload ni MAJ DB")
    args = ap.parse_args()

    key = load_key()
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}

    products = fetch_products(headers)
    print(f"{len(products)} produits publiés chargés.\n")

    rollback = []
    mapping = {}
    n_changed = 0

    for p in products:
        pid = p["id"]
        name = p["name"]
        old_main = p.get("main_image_url")
        old_gallery = p.get("gallery_images") or []

        new_main = old_main
        new_gallery = list(old_gallery)
        changed = False

        if old_main:
            try:
                res = process_image(old_main, headers, args.dry_run)
                if res["changed"]:
                    new_main = res["url"]
                    changed = True
                    n_changed += 1
                    mapping[old_main] = res["url"]
                    print(f"  {name[:42]:<42} {res['ratio']:.2f} ({res['w']}x{res['h']}) -> 3:4 ({res['nw']}x{res['nh']})")
                else:
                    print(f"  {name[:42]:<42} {res['ratio']:.2f} ({res['w']}x{res['h']}) — déjà 3:4")
            except Exception as e:
                print(f"  {name[:42]:<42} ERREUR main: {e}")

        for i, u in enumerate(old_gallery):
            try:
                res = process_image(u, headers, args.dry_run)
                if res["changed"]:
                    new_gallery[i] = res["url"]
                    changed = True
                    n_changed += 1
                    mapping[u] = res["url"]
                    print(f"  {name[:42]:<42} [gal {i+1}] {res['ratio']:.2f} ({res['w']}x{res['h']}) -> 3:4 ({res['nw']}x{res['nh']})")
            except Exception as e:
                print(f"  {name[:42]:<42} [gal {i+1}] ERREUR: {e}")

        rollback.append(
            {
                "id": pid,
                "name": name,
                "old_main_image_url": old_main,
                "old_gallery_images": old_gallery,
                "new_main_image_url": new_main,
                "new_gallery_images": new_gallery,
            }
        )

        if changed and not args.dry_run:
            body = {"main_image_url": new_main, "gallery_images": new_gallery}
            r = requests.patch(
                f"{SUPA_URL}/rest/v1/products?id=eq.{pid}",
                headers={**headers, "Content-Type": "application/json", "Prefer": "return=minimal"},
                json=body,
                timeout=60,
            )
            r.raise_for_status()
            print(f"    -> DB mise à jour : {name[:44]}")
        elif changed and args.dry_run:
            print(f"    -> (dry-run) serait mis à jour : {name[:44]}")

    with open(ROLLBACK_FILE, "w") as f:
        json.dump(rollback, f, ensure_ascii=False, indent=2)
    with open(MAPPING_FILE, "w") as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)

    print(f"\n{'=== DRY-RUN ===' if args.dry_run else '=== TERMINÉ ==='}")
    print(f"Images à recadrer (ratio ≠ 3:4) : {n_changed}")
    print(f"Originaux téléchargés dans : {BACKUP_DIR}")
    print(f"Rollback : {ROLLBACK_FILE}")
    print(f"Mapping old→new : {MAPPING_FILE}")


if __name__ == "__main__":
    main()
