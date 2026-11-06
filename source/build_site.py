page=open('page.html').read(); core=open('core.js').read(); app=open('app.js').read()
body=page.replace('/*__CORE__*/',core).replace('/*__NLP__*/',open('nlp.js').read()).replace('/*__APP__*/',app)
body=body.replace('<meta name="claude:viewport-fit-sides" content="cover">\n','')
title_end=body.index('</title>')+len('</title>')
head_extra='''
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="description" content="KFI'S — gestion financière de Khalil et Yousra">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="KFI'S">
<meta name="theme-color" content="#0A0A0B">
<link rel="icon" href="icon.png">
<link rel="apple-touch-icon" href="icon.png">
<link rel="manifest" href="manifest.webmanifest">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font-family:system-ui,sans-serif;font-size:14px}img{max-width:100%}[hidden]{display:none!important}</style>
<script>window.KFIS_STANDALONE=true;</script>'''
first, rest = body[:title_end], body[title_end:]
# split head-ish content (title, links, style) from body markup at '<div class="app">'
i=rest.index('<div class="app">')
doc='<!doctype html>\n<html lang="fr-CA">\n<head>\n'+first+head_extra+rest[:i]+'</head>\n<body>\n'+rest[i:]+'\n</body>\n</html>\n'
open('site/index.html','w').write(doc)
open('site/manifest.webmanifest','w').write('{"name":"KFI\'S","short_name":"KFI\'S","lang":"fr-CA","start_url":"./","display":"standalone","background_color":"#0A0A0B","theme_color":"#0A0A0B","icons":[{"src":"icon.png","sizes":"512x512","type":"image/png"}]}')
open('site/.nojekyll','w').write('')
print(len(doc))
