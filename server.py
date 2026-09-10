#!/usr/bin/env python3
"""
Lumina Living — Python E-Commerce Backend Server
Serves static assets and provides REST API for Products, Cart Validation, and Order Processing.
"""

import os
import json
import random
from datetime import datetime
from urllib.parse import urlparse, parse_qs
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 5000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PRODUCTS_FILE = os.path.join(BASE_DIR, 'data', 'products.json')
ORDERS_FILE = os.path.join(BASE_DIR, 'data', 'orders.json')
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')

PROMO_CODES = {
    'LUMINA15': {'discountPercent': 15, 'description': '15% Off Lumina Living Collection'},
    'HOMELUXE20': {'discountPercent': 20, 'description': '20% Off Luxury Furniture & Decor'},
    'WELCOME10': {'discountPercent': 10, 'description': '10% Welcome Gift'}
}

def read_json_file(filepath, default=None):
    if default is None:
        default = []
    if not os.path.exists(filepath):
        return default
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return default

def write_json_file(filepath, data):
    try:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error writing {filepath}: {e}")
        return False

class LuminaAPIHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def _send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        # 1. GET /api/products
        if path == '/api/products':
            products = read_json_file(PRODUCTS_FILE)
            category = query.get('category', ['all'])[0]
            search = query.get('search', [''])[0].strip().lower()
            sort_by = query.get('sort', ['featured'])[0]

            if category and category != 'all':
                products = [p for p in products if p.get('category', '').lower() == category.lower()]

            if search:
                products = [p for p in products if search in p.get('name', '').lower() or search in p.get('description', '').lower() or search in p.get('category', '').lower()]

            if sort_by == 'price-asc':
                products.sort(key=lambda x: x.get('price', 0))
            elif sort_by == 'price-desc':
                products.sort(key=lambda x: x.get('price', 0), reverse=True)
            elif sort_by == 'rating':
                products.sort(key=lambda x: x.get('rating', 0), reverse=True)
            elif sort_by == 'name-asc':
                products.sort(key=lambda x: x.get('name', '').lower())

            self._send_json(200, {'success': True, 'count': len(products), 'data': products})
            return

        # 2. GET /api/products/<id>
        if path.startswith('/api/products/'):
            prod_id = path.replace('/api/products/', '').strip('/')
            products = read_json_file(PRODUCTS_FILE)
            product = next((p for p in products if p['id'] == prod_id), None)
            if product:
                self._send_json(200, {'success': True, 'data': product})
            else:
                self._send_json(404, {'success': False, 'message': 'Product not found'})
            return

        # 3. GET /api/categories
        if path == '/api/categories':
            products = read_json_file(PRODUCTS_FILE)
            cats = {}
            for p in products:
                c = p.get('category', 'other')
                cats[c] = cats.get(c, 0) + 1
            self._send_json(200, {'success': True, 'data': cats})
            return

        # 4. GET /api/orders
        if path == '/api/orders':
            orders = read_json_file(ORDERS_FILE)
            self._send_json(200, {'success': True, 'count': len(orders), 'data': orders})
            return

        # 5. GET /api/orders/<id>
        if path.startswith('/api/orders/'):
            order_id = path.replace('/api/orders/', '').strip('/')
            orders = read_json_file(ORDERS_FILE)
            order = next((o for o in orders if o['id'].lower() == order_id.lower()), None)
            if order:
                self._send_json(200, {'success': True, 'data': order})
            else:
                self._send_json(404, {'success': False, 'message': 'Order not found'})
            return

        # Default: Serve static files from public/
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        content_length = int(self.headers.get('Content-Length', 0))
        body_data = {}
        if content_length > 0:
            try:
                body_data = json.loads(self.rfile.read(content_length).decode('utf-8'))
            except Exception as e:
                self._send_json(400, {'success': False, 'message': 'Invalid JSON format'})
                return

        # 1. POST /api/promo/validate
        if path == '/api/promo/validate':
            code = (body_data.get('code') or '').strip().upper()
            if not code:
                self._send_json(400, {'success': False, 'message': 'Promo code is required'})
                return

            if code in PROMO_CODES:
                promo = PROMO_CODES[code]
                self._send_json(200, {
                    'success': True,
                    'code': code,
                    'discountPercent': promo['discountPercent'],
                    'description': promo['description']
                })
            else:
                self._send_json(404, {'success': False, 'message': 'Invalid promo code. Try LUMINA15 or HOMELUXE20'})
            return

        # 2. POST /api/orders (Order Processing)
        if path == '/api/orders':
            customer = body_data.get('customer', {})
            items = body_data.get('items', [])
            promo_code = body_data.get('promoCode')

            if not customer.get('fullName') or not customer.get('email') or not customer.get('address'):
                self._send_json(400, {'success': False, 'message': 'Customer Name, Email and Address are required'})
                return

            if not items:
                self._send_json(400, {'success': False, 'message': 'Cart is empty'})
                return

            products = read_json_file(PRODUCTS_FILE)
            order_items = []
            subtotal = 0.0

            for item in items:
                prod = next((p for p in products if p['id'] == item.get('id')), None)
                if not prod:
                    self._send_json(400, {'success': False, 'message': f"Product {item.get('id')} not found"})
                    return

                qty = int(item.get('quantity', 1))
                if prod['stock'] < qty:
                    self._send_json(400, {'success': False, 'message': f"Insufficient stock for '{prod['name']}'. Available: {prod['stock']}"})
                    return

                # Deduct inventory
                prod['stock'] -= qty
                order_items.append({
                    'id': prod['id'],
                    'name': prod['name'],
                    'price': prod['price'],
                    'quantity': qty,
                    'image': prod['image']
                })
                subtotal += prod['price'] * qty

            # Promo calculation
            discount_percent = 0
            if promo_code and promo_code.upper() in PROMO_CODES:
                discount_percent = PROMO_CODES[promo_code.upper()]['discountPercent']

            discount_amount = round((subtotal * discount_percent) / 100.0, 2)
            discounted_subtotal = subtotal - discount_amount
            tax = round(discounted_subtotal * 0.08, 2)
            shipping = 0.0 if discounted_subtotal > 150 else 14.99
            total = round(discounted_subtotal + tax + shipping, 2)

            order_id = f"LUM-{random.randint(10000, 99999)}"
            new_order = {
                'id': order_id,
                'createdAt': datetime.utcnow().isoformat() + 'Z',
                'customer': {
                    'fullName': customer.get('fullName'),
                    'email': customer.get('email'),
                    'phone': customer.get('phone', 'N/A'),
                    'address': customer.get('address'),
                    'city': customer.get('city', 'N/A'),
                    'state': customer.get('state', 'N/A'),
                    'zip': customer.get('zip', 'N/A'),
                    'country': customer.get('country', 'United States')
                },
                'items': order_items,
                'subtotal': round(subtotal, 2),
                'discountAmount': discount_amount,
                'promoCode': promo_code.upper() if discount_percent > 0 else None,
                'tax': tax,
                'shipping': shipping,
                'total': total,
                'paymentMethod': customer.get('paymentMethod', 'Credit Card (Simulated)'),
                'status': 'Confirmed & In Artisan Preparation'
            }

            orders = read_json_file(ORDERS_FILE)
            orders.insert(0, new_order)

            write_json_file(PRODUCTS_FILE, products)
            write_json_file(ORDERS_FILE, orders)

            self._send_json(201, {
                'success': True,
                'message': 'Order successfully placed!',
                'data': new_order
            })
            return

        self._send_json(404, {'success': False, 'message': 'Route not found'})

def run_server():
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, LuminaAPIHandler)
    print("=======================================================")
    print(f">> Lumina Living Server running at: http://localhost:{PORT}")
    print(f">> REST API Ready at http://localhost:{PORT}/api/products")
    print("=======================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer shutting down gracefully.")
        httpd.server_close()

if __name__ == '__main__':
    run_server()

