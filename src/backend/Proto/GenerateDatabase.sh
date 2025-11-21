#!/bin/bash

npx pbjs -t static-module -o Proto/database.js Proto/database.proto
npx pbts -o Proto/database.d.ts Proto/database.js