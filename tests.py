import os
import re
import unittest
from lxml import html

import local_app


class SiteTestCase(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        root = local_app.app.root_path
        cls.site_html = ['/' + x for x in os.listdir(os.path.join(root, 'templates'))
                          if not x.startswith('_')]
        cls.site_assets = ['/assets/' + x for x in os.listdir(os.path.join(root, 'site', 'assets'))
                            if not x.startswith('_') and not x.endswith('.html')]
    
    def setUp(self):
        local_app.app.config['TESTING'] = True
        self.app = local_app.app.test_client()
    
    def test_get_index(self):
        with self.app.get('/') as resp:
            self.assertEqual(resp.status_code, 200)
    
    def test_get_html(self):
        self.assertGreater(len(self.site_html), 0)
        for f in self.site_html:
            with self.app.get(f, follow_redirects=True) as resp:
                self.assertEqual(resp.status_code, 200, f)
                data = str(resp.get_data())
                self.assertIn('<!DOCTYPE html>', data, f)
                self.assertIn('href="/about.html"', data, f)
    
    def test_get_assets(self):
        self.assertGreater(len(self.site_assets), 0)
        for f in self.site_assets:
            with self.app.get(f) as resp:
                self.assertEqual(resp.status_code, 200, f)
    
    def test_crawl_links(self):
        plain_text = {'html', 'js', 'css'}
        unvisited_html = set(self.site_html)
        unvisited_assets = set(self.site_assets)
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
                    if link in unvisited_html or link in unvisited_assets:
                        links.append(link)
                for link in links:
                    crawl(link)
            elif page in unvisited_assets:
                unvisited_assets.remove(page)
                if data:
                    resources = (re.findall(r'"\S+?\.png"', data)
                                 + re.findall(r'"\S+?\.json"', data))
                    for resource in resources:
                        resource = resource[1:-1]
                        if resource in self.site_assets:
                            crawl(resource)
        crawl('/index.html')
        self.assertEqual(len(unvisited_html), 0, unvisited_html)
        self.assertEqual(len(unvisited_assets), 0, unvisited_assets)
    
    def test_not_filename(self):
        with self.app.get('/index') as resp:
            self.assertEqual(resp.status_code, 404)
    
    def test_nonexistent_path(self):
        with self.app.get('/site/index.html') as resp:
            self.assertEqual(resp.status_code, 404)


if __name__ == '__main__':
    unittest.main(verbosity=2)
