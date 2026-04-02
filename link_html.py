import os
import re

# We will modify the HTML to inject actual anchor tags over buttons or specific elements 
# to link the workflow:
# 1. index.html (Language) -> click a language card -> date-selection.html
# 2. date-selection.html -> click "Continue" -> event-list.html
# 3. event-list.html -> click "Ido-Oba" card -> ceremony-detail.html
# 4. event-list.html -> click "Guest List" tab/link -> guest-list.html
# 5. guest-list.html -> click "Aso Ebi" or back -> event-list.html
# 6. event-list.html -> click "Vendor Market" -> vendor-marketplace.html

def add_link_to_text(html, search_text, link):
    # This is a very rudimentary search and replace for simple text wrapping
    # Ideally, we find the container and wrap it.
    # We'll use regex to wrap the element containing the text with an <a href>
    pattern = rf'(<[^>]+>[^<]*?)({search_text})([^<]*?</[^>]+>)'
    # Wrap the whole inner content in a tag, or just change the button tag
    replacement = rf'\1<a href="{link}" style="text-decoration: none; color: inherit;">\2</a>\3'
    return re.sub(pattern, replacement, html, count=1)

def replace_button_with_link(html, button_text, link):
    # Find button containing the text and wrap it or change it to an anchor
    pattern = rf'<button([^>]*?)>([\s\S]*?{button_text}[\s\S]*?)</button>'
    replacement = rf'<a href="{link}"\1 style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center;">\2</a>'
    return re.sub(pattern, replacement, html)

# 1. index.html -> date-selection.html
with open('public/index.html', 'r') as f:
    content = f.read()
content = add_link_to_text(content, "Hausa", "date-selection.html")
content = add_link_to_text(content, "Igbo", "date-selection.html")
content = add_link_to_text(content, "Yoruba", "date-selection.html")
with open('public/index.html', 'w') as f:
    f.write(content)

# 2. date-selection.html -> event-list.html
with open('public/date-selection.html', 'r') as f:
    content = f.read()
content = replace_button_with_link(content, "Continue", "event-list.html")
with open('public/date-selection.html', 'w') as f:
    f.write(content)

# 3. event-list.html links
with open('public/event-list.html', 'r') as f:
    content = f.read()
content = add_link_to_text(content, "Ido-Oba", "ceremony-detail.html")
content = add_link_to_text(content, "Guest List", "guest-list.html")
content = add_link_to_text(content, "Vendor Market", "vendor-marketplace.html")
content = add_link_to_text(content, "Vendors", "vendor-marketplace.html")
with open('public/event-list.html', 'w') as f:
    f.write(content)

# 4. ceremony-detail.html back to event list
with open('public/ceremony-detail.html', 'r') as f:
    content = f.read()
content = add_link_to_text(content, "Back", "event-list.html")
content = add_link_to_text(content, "Save to Itinerary", "event-list.html")
with open('public/ceremony-detail.html', 'w') as f:
    f.write(content)

# 5. guest-list.html back to event list
with open('public/guest-list.html', 'r') as f:
    content = f.read()
content = add_link_to_text(content, "Back", "event-list.html")
content = add_link_to_text(content, "Events", "event-list.html")
with open('public/guest-list.html', 'w') as f:
    f.write(content)

# 6. vendor-marketplace.html back to event list
with open('public/vendor-marketplace.html', 'r') as f:
    content = f.read()
content = add_link_to_text(content, "Back", "event-list.html")
content = add_link_to_text(content, "Events", "event-list.html")
with open('public/vendor-marketplace.html', 'w') as f:
    f.write(content)

print("Linked screens successfully.")
