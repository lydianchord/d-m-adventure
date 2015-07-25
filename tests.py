import os
import unittest

import local_app


class SiteTestCase(unittest.TestCase):
    
    def setUp(self):
        local_app.app.config['TESTING'] = True
        self.app = local_app.app.test_client()
        root = local_app.app.root_path
        self.site_html = [x for x in os.listdir(os.path.join(root, 'templates'))
                          if not x.startswith('_')]
        self.site_static = [x for x in os.listdir(os.path.join(root, 'site'))
                            if not x.endswith('.html')]
    
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
                if f.endswith('.html'):
                    data = str(resp.get_data())
                    self.assertIn('<!DOCTYPE html>', data, f)
                    self.assertIn('href="about.html"', data, f)
    
    def test_get_static(self):
        self.assertGreater(len(self.site_html), 0)
        for f in self.site_static:
            with self.app.get('/' + f) as resp:
                self.assertEqual(resp.status_code, 200, f)
    
    def test_not_filename(self):
        with self.app.get('/index') as resp:
            self.assertEqual(resp.status_code, 404)
    
    def test_nonexistent_path(self):
        with self.app.get('/site/index.html') as resp:
            self.assertEqual(resp.status_code, 404)


if __name__ == '__main__':
    unittest.main()
