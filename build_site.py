import os
from jinja2 import Environment, FileSystemLoader

env = Environment(loader=FileSystemLoader(searchpath='templates'))

def render_template(template_name):
    template = env.get_template(template_name)
    pair = (template_name, template.render())
    return pair

def to_files(rendered_list):
    for name, text in rendered_list:
        with open(name, 'w') as f:
            f.write(text)

if __name__ == '__main__':
    templates = os.listdir('templates/')
    rendered_templates = [render_template(template) for template in templates]
    to_files(rendered_templates)
