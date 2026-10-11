# igle-songs

Web para gestionar las letras de canciones de la iglesia: convierte presentaciones PowerPoint en imágenes, las guarda en Cloudflare R2 y permite buscarlas y copiarlas.

## Variables de entorno

Crea un archivo `.env` en la raíz:

```env
MASTER_PASSWORD=...
R2_ENDPOINT=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_URL=https://iglesia-storage.stageddat.dev
```

## Despliegue con Docker

La imagen ya incluye LibreOffice, poppler y las fuentes chinas necesarias para convertir las diapositivas.

```bash
# la app corre como usuario 1000 dentro del contenedor
sudo chown -R 1000:1000 data

docker compose up -d --build
```

La web queda en `http://localhost:9999`. La carpeta `data/` (con `songs.json` y los archivos en proceso) se monta como volumen, así que no se pierde al reconstruir el contenedor.

Comandos útiles:

```bash
docker compose logs -f              # ver logs
docker compose up -d --build        # actualizar tras un git pull
docker compose down                 # parar
```

### Migrar desde PM2

```bash
pm2 delete igle && pm2 save
cd /srv/igle && git pull
sudo chown -R 1000:1000 data
docker compose up -d --build
```

## Desarrollo

Requiere Node 22, pnpm 10, LibreOffice (`soffice`) y poppler (`pdftoppm`).

```bash
pnpm install
pnpm dev
pnpm lint
```
