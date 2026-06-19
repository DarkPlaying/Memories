import os

def analyze_obj():
    obj_path = "public/Iphone 8.obj"
    if not os.path.exists(obj_path):
        print(f"File not found: {obj_path}")
        return

    min_x = min_y = min_z = float('inf')
    max_x = max_y = max_z = float('-inf')
    
    count = 0
    with open(obj_path, 'r') as f:
        for line in f:
            if line.startswith('v '):
                parts = line.strip().split()
                if len(parts) >= 4:
                    try:
                        x = float(parts[1])
                        y = float(parts[2])
                        z = float(parts[3])
                        min_x = min(min_x, x)
                        max_x = max(max_x, x)
                        min_y = min(min_y, y)
                        max_y = max(max_y, y)
                        min_z = min(min_z, z)
                        max_z = max(max_z, z)
                        count += 1
                    except ValueError:
                        pass

    print(f"Total vertices: {count}")
    print(f"X range: {min_x} to {max_x} (center: {(min_x + max_x)/2:.4f}, size: {max_x - min_x:.4f})")
    print(f"Y range: {min_y} to {max_y} (center: {(min_y + max_y)/2:.4f}, size: {max_y - min_y:.4f})")
    print(f"Z range: {min_z} to {max_z} (center: {(min_z + max_z)/2:.4f}, size: {max_z - min_z:.4f})")

if __name__ == '__main__':
    analyze_obj()
