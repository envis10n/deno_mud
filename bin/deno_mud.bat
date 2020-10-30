@ECHO OFF
SET ScriptDir=%~dp0
SET MainFile=%ScriptDir%..\deno_mud.ts
ECHO %MainFile%
deno run --allow-net --allow-read %MainFile%