from .base import *
import os

DEBUG = False

SECURE_PROXY_SSL_HEADER         = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT             = True
SECURE_HSTS_SECONDS             = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS  = True
SECURE_HSTS_PRELOAD             = True
SESSION_COOKIE_SECURE           = True
CSRF_COOKIE_SECURE              = True
X_FRAME_OPTIONS                 = 'DENY'
SECURE_BROWSER_XSS_FILTER       = True

# WhiteNoise for static files on Render
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

