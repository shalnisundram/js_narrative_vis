import json

# Load the location data
with open('data/country-by-region-in-world.json') as fp:
    locations_data = json.load(fp)

with open('/Users/shalnisundram/Documents/UIUC/Academics/Summer2024Semester!/CS_416/js_narrative_vis/data/exports-by-country-2024.json') as exports_fp:
    exports_data = json.load(exports_fp)
    
# Create a dictionary for quick lookup
locations_dict = {entry['country']: entry['location'] for entry in locations_data}

# Join the data
for entry in exports_data:
    country = entry['country']
    if country in locations_dict:
        entry['region'] = locations_dict[country]
    else:
        entry['region'] = 'Unknown'

# Save the updated data back to a JSON file
with open('data/updated-exports-by-country-2024.json', 'w') as fp:
    json.dump(exports_data, fp, indent=4)