import os
from jinja2 import Environment, FileSystemLoader

env = Environment(loader=FileSystemLoader(searchpath='templates'))

game_pages = set((
    '4internet.html', 'canvasgame.html', 'danmaku.html', 'rps.html'
))

def render_template(template_name):
    template = env.get_template(template_name)
    if template_name in game_pages:
        game_body_id = ' id="gamebody"'
    else:
        game_body_id = ''
    return template_name, template.render(game_body_id=game_body_id)

def to_files(rendered_list):
    for name, text in rendered_list:
        with open(os.path.join('site', name), 'w') as f:
            f.write(text)

if __name__ == '__main__':
    templates = os.listdir('templates/')
    rendered_templates = [
        render_template(template) for template in templates
        if not template.startswith('_')
    ]
    to_files(rendered_templates)
