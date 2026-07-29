#!/bin/bash
sed -i 's/localStorage\.getItem/safeStorage.getItem/g' src/NutBoltGame.tsx
sed -i 's/localStorage\.setItem/safeStorage.setItem/g' src/NutBoltGame.tsx
sed -i 's/localStorage\.clear/safeStorage.clear/g' src/NutBoltGame.tsx

sed -i '/import { Trophy, RotateCcw,/i \
const safeStorage = {\
  getItem: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },\
  setItem: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },\
  clear: () => { try { localStorage.clear(); } catch (e) {} }\
};\
' src/NutBoltGame.tsx
