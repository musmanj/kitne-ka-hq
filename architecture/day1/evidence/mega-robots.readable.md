#################################
# Allow ChatGPT and other bots
#################################
User-agent: OAI-SearchBot
Allow: /

User-agent: GPTBot
Allow: /

# Default rules for all other bots
User-agent: *
Allow: /

#################################
# ð« Block internal, admin & user pages
#################################
Disallow: /cart/
Disallow: /checkout/
Disallow: /login/
Disallow: /register/
Disallow: /signup/
Disallow: /wishlist/
Disallow: /my/
Disallow: /account/
Disallow: /cgi-bin/
Disallow: /tmp/
Disallow: /admin/

#################################
# ð« Block dynamic, broken, or duplicate URLs
#################################
Disallow: /\"$url\"/
Disallow: /\"$url\"
Disallow: /\"/
Disallow: /*\"*/
Disallow: //   # double slashes

#################################
# ð« Block unnecessary product-build & script URLs
#################################
# /items_images/ was disallowed until 2026-10-30; that hid every product image from Google Images, Product rich results and Merchant Center.
Allow: /items_images/
# Disallow: /*tss_*  (removed 2026-10-30: it blocked the product thumbnail images named tss_ .webp)
Disallow: /get_cat_url
Disallow: /get_detail_url
Disallow: /get_cat_accessories_url

#################################
# ð« Block filtered, sorted & tracking URLs
#################################
Disallow: /*?sort=
Disallow: /*?filter=
Disallow: /*?brand=
Disallow: /*?page=
Disallow: /*?color=
Disallow: /*?size=
Disallow: /*?q=
Disallow: /*?condition=
Disallow: /*?price=
Disallow: /*?_=*
Disallow: /*?amp=*
Disallow: /*?fbclid
Disallow: /*?gclid

#################################
# ð« Block duplicate comparison-style URLs
#################################
Disallow: /*/*-vs--*
Disallow: /*--vs--*

#################################
# â Allow main product & category pages
#################################
Allow: /product/
Allow: /products/
Allow: /laptops/
Allow: /used/laptops/
Allow: /DSLRcameras/
Allow: /actioncameras/
Allow: /accessories/

# â Allow comparison pages (for SEO)
Allow: /*/comparison/
Allow: /*?model1=
Allow: /*?model2=

#################################
# Sitemaps
#################################
Sitemap: https://www.mega.pk/sitemap.xml