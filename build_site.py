import os
import datetime
from jinja2 import Environment, FileSystemLoader

env = Environment(loader=FileSystemLoader(searchpath='templates'))
current_date = str(datetime.date.today())


def render_template(template_name):
    template = env.get_template(template_name)
    text = template.render(current_date=current_date) + '\n'
    writing = False
    destination = os.path.join('site', template_name)
    if os.path.exists(destination):
        with open(destination, 'r', encoding="utf-8") as f:
            old_text = f.read()
        if old_text != text:
            writing = True
            print('Modified: ' + template_name)
    else:
        writing = True
        print('Added: ' + template_name)
    if writing:
        with open(destination, 'w', encoding="utf-8") as f:
            f.write(text)


if __name__ == '__main__':
    templates = os.listdir('templates/')
    for template in templates:
        if template[0] != '_':
            render_template(template)
