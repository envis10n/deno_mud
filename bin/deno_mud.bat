@ECHO OFF
SET ScriptDir=%~dp0
SET ScriptDir=%ScriptDir%:~0,-1%

SET MainFile=%ScriptDir%"..\deno_mud.ts"

deno run %MainFile% --allow-net