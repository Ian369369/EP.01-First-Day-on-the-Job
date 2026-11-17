#!/usr/bin/env bash
# PUT a local file to a Higgsfield presigned upload URL (from media_upload). Usage: hf_put.sh <file> <content-type> '<url>'
curl -sS -o /dev/null -w "%{http_code} $1\n" -X PUT -H "Content-Type: $2" --data-binary @"$1" "$3"
