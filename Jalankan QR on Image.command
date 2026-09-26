#!/bin/zsh

set -e
cd -- "${0:A:h}"

if ! command -v node >/dev/null || ! command -v npm >/dev/null; then
  echo "Node.js dan npm belum terpasang. Pasang Node.js 22.13 atau lebih baru."
  read -k 1 "?Tekan tombol apa saja untuk menutup..."
  exit 1
fi

[[ -d node_modules ]] || npm install

npm run dev &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT INT TERM

for _ in {1..60}; do
  if curl -fsS http://localhost:5173 >/dev/null 2>&1; then
    open http://localhost:5173
    wait "$server_pid"
    exit
  fi

  kill -0 "$server_pid" 2>/dev/null || wait "$server_pid"
  sleep 1
done

echo "Server tidak siap dalam 60 detik."
exit 1
