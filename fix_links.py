import os
import re

extensions = ('html', 'js', 'css', 'json', 'png', 'ico')
ignore = ('_', 'http', '//')
assets_to_check = {'js', 'css'}
templates = set(os.listdir('templates'))
assets = set(os.listdir('site/assets'))


def make_link(m):
    result = m.group()[1:-1]
    if all(not result.startswith(x) for x in ignore):
        resource = result.rsplit('/')[-1]
        base_resource = resource.split('?', 1)[0]
        if base_resource in templates or base_resource in assets:
            if '.html' in resource:
                link = '/' + resource
            else:
                link = '/assets/' + resource
        else:
            link = resource if '.ico' not in resource else '/' + resource
    else:
        link = result
    return '"%s"' % link


def fix_links(text):
    for ext in extensions:
        text = re.sub(r'"\S+?\.%s\S*?"' % ext, make_link, text)
    return text


for file in templates:
    with open('templates/' + file, encoding="utf-8") as f:
        text = f.read()
    text = fix_links(text)
    with open('_excluded/output/templates/' + file, 'w', encoding="utf-8") as f:
        f.write(text)
for file in assets:
    file_ext = file.rsplit('.', 1)[-1]
    if file_ext in assets_to_check and '.min.' not in file:
        with open('site/assets/' + file, encoding="utf-8") as f:
            text = f.read()
        text = fix_links(text)
        with open('_excluded/output/assets/' + file, 'w', encoding="utf-8") as f:
            f.write(text)
