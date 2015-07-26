import os
import unittest
from selenium import webdriver


class InteractiveTestCase(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        cls.driver = webdriver.Firefox()
    
    @classmethod
    def tearDownClass(cls):
        cls.driver.close()
    
    def test_caesar_cipher(self):
        driver = self.driver
        css = driver.find_element_by_css_selector
        driver.get('http://localhost:5000/caesarcipher.html')
        message_input = css('input[ng-model="vm.message"]')
        clear_button = css('div.formrow > button')
        key_template = 'select[ng-model="vm.key"] > option[value="%s"]'
        conversion_template = 'select[ng-model="vm.conversion"] > option[value="%s"]'
        result_template = 'div#resultsbox li'
        original_message = 'python'
        encrypted_message = 'OXSGNM'
        decrypted_message = original_message.upper()
        # encrypt by key
        message_input.send_keys(original_message)
        css(key_template % '25').click()
        css(conversion_template % 'encrypt').click()
        self.assertEqual(css(result_template).text, encrypted_message)
        clear_button.click()
        # decrypt by key
        message_input.send_keys(encrypted_message)
        css(conversion_template % 'decrypt').click()
        self.assertEqual(css(result_template).text, decrypted_message)
        # decrypt by brute force
        css(key_template % 'brute').click()
        self.assertEqual(css(result_template).text, decrypted_message)
        # check permalink
        expected_permalink = ('http://localhost:5000/caesarcipher.html'
                              + '?message=%s&key=brute&conversion=decrypt'
                              % encrypted_message)
        permalink = css('input[ng-model="vm.permalink"]').get_attribute('value')
        self.assertEqual(permalink, expected_permalink)
        driver.get(permalink)
        self.assertEqual(css(result_template).text, decrypted_message)


if __name__ == '__main__':
    unittest.main(verbosity=2)
