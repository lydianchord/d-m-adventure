import os
import unittest
from lxml import html

import local_app


class SiteTestCase(unittest.TestCase):
    
    def setUp(self):
        local_app.app.config['TESTING'] = True
        self.app = local_app.app.test_client()
        root = local_app.app.root_path
        self.site_html = [x for x in os.listdir(os.path.join(root, 'templates'))
                          if not x.startswith('_')]
        self.site_static = [x for x in os.listdir(os.path.join(root, 'site'))
                            if not x.startswith('_') and not x.endswith('.html')]
    
    def tearDown(self):
        pass
    
    def test_get_index(self):
        with self.app.get('/') as resp:
            self.assertEqual(resp.status_code, 200)
    
    def test_get_html(self):
        self.assertGreater(len(self.site_html), 0)
        for f in self.site_html:
            with self.app.get('/' + f, follow_redirects=True) as resp:
                self.assertEqual(resp.status_code, 200, f)
                data = str(resp.get_data())
                self.assertIn('<!DOCTYPE html>', data, f)
                self.assertIn('href="about.html"', data, f)
    
    def test_get_static(self):
        self.assertGreater(len(self.site_static), 0)
        for f in self.site_static:
            with self.app.get('/' + f) as resp:
                self.assertEqual(resp.status_code, 200, f)
    
    def test_crawl_links(self):
        plain_text = {'html', 'js', 'css'}
        unvisited_html = set(self.site_html)
        unvisited_static = set(self.site_static)
        def crawl(page):
            with self.app.get(page, follow_redirects=True) as resp:
                self.assertEqual(resp.status_code, 200, page)
                if page.rsplit('.', 1)[-1] in plain_text:
                    data = str(resp.get_data())
                else:
                    data = None
            if page in unvisited_html:
                unvisited_html.remove(page)
                tree = html.fromstring(data)
                links = []
                for result in tree.iterlinks():
                    link = result[2].split('?', 1)[0]
                    if link in unvisited_html or link in unvisited_static:
                        links.append(link)
                for link in links:
                    crawl(link)
            elif page in unvisited_static:
                unvisited_static.remove(page)
                if data:
                    removable = set()
                    for resource in unvisited_static:
                        if resource in data:
                            removable.add(resource)
                    unvisited_static.difference_update(removable)
        crawl('index.html')
        self.assertEqual(len(unvisited_html), 0, unvisited_html)
        self.assertEqual(len(unvisited_static), 0, unvisited_static)
    
    def test_not_filename(self):
        with self.app.get('/index') as resp:
            self.assertEqual(resp.status_code, 404)
    
    def test_nonexistent_path(self):
        with self.app.get('/site/index.html') as resp:
            self.assertEqual(resp.status_code, 404)


if __name__ == '__main__':
    unittest.main()
