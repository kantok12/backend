#!/usr/bin/env bash
# Example calls for prerrequisitos match

# Single (GET convenience)
curl -sS "http://localhost:3000/prerequisitos/clientes/28/match?rut=20.011.078-1" | jq

# Batch (POST)
curl -sS -X POST -H "Content-Type: application/json" -d '{"ruts":["20.011.078-1","20011078-1"]}' "http://localhost:3000/prerequisitos/clientes/28/match" | jq
