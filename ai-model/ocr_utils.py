import cv2
import numpy as np
import pytesseract
import re
from datetime import datetime, timedelta
from PIL import Image
import io
import base64

# Configure pytesseract path (adjust for your system)
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'  # Windows
# pytesseract.pytesseract.tesseract_cmd = '/usr/bin/tesseract'  # Linux/Mac

def preprocess_image_for_ocr(image_data):
    """Preprocess image for better OCR results"""
    try:
        # Decode base64 image
        if isinstance(image_data, str):
            image_bytes = base64.b64decode(image_data.split(',')[1])
        else:
            image_bytes = image_data
        
        # Convert to PIL Image
        img = Image.open(io.BytesIO(image_bytes))
        
        # Convert to OpenCV format
        img_cv = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        
        # Convert to grayscale
        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        
        # Apply noise reduction
        denoised = cv2.fastNlMeansDenoising(gray)
        
        # Apply threshold to get binary image
        _, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Apply morphological operations to clean up
        kernel = np.ones((1, 1), np.uint8)
        cleaned = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        
        return cleaned
        
    except Exception as e:
        print(f"Error preprocessing image: {e}")
        return None

def extract_date_patterns(text):
    """Extract various date patterns from text"""
    date_patterns = [
        # DD/MM/YYYY or MM/DD/YYYY
        r'\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b',
        # YYYY-MM-DD
        r'\b(\d{4})-(\d{1,2})-(\d{1,2})\b',
        # DD.MM.YYYY
        r'\b(\d{1,2})\.(\d{1,2})\.(\d{2,4})\b',
        # Month DD, YYYY
        r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})\b',
        # DD Month YYYY
        r'\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\b',
        # Expiry date patterns
        r'\b(exp|expiry|best before|use by|sell by)[:\s]+(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b',
        r'\b(exp|expiry|best before|use by|sell by)[:\s]+(\d{4})-(\d{1,2})-(\d{1,2})\b',
    ]
    
    month_map = {
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
        'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
    }
    
    dates = []
    text_lower = text.lower()
    
    for pattern in date_patterns:
        matches = re.finditer(pattern, text_lower, re.IGNORECASE)
        for match in matches:
            try:
                groups = match.groups()
                
                if len(groups) == 3:
                    # Standard date format
                    if len(groups[2]) == 2:  # YY format
                        year = 2000 + int(groups[2]) if int(groups[2]) < 50 else 1900 + int(groups[2])
                    else:
                        year = int(groups[2])
                    
                    # Check if first group is month name
                    if groups[0].lower() in month_map:
                        month = month_map[groups[0].lower()]
                        day = int(groups[1])
                    elif groups[1].lower() in month_map:
                        month = month_map[groups[1].lower()]
                        day = int(groups[0])
                    else:
                        # Assume DD/MM format
                        day = int(groups[0])
                        month = int(groups[1])
                    
                    date_obj = datetime(year, month, day)
                    dates.append({
                        'date': date_obj,
                        'confidence': 0.8,
                        'pattern': match.group(),
                        'position': match.span()
                    })
                    
            except (ValueError, IndexError) as e:
                continue
    
    return dates

def extract_expiry_date(image_data):
    """Extract expiry date from food label image"""
    try:
        # Preprocess image
        processed_img = preprocess_image_for_ocr(image_data)
        if processed_img is None:
            return {"error": "Failed to process image"}
        
        # OCR extraction
        text = pytesseract.image_to_string(processed_img, config='--psm 6')
        
        # Extract date patterns
        dates = extract_date_patterns(text)
        
        if not dates:
            return {
                "error": "No expiry date found",
                "extracted_text": text[:200]  # First 200 chars for debugging
            }
        
        # Sort by confidence and return the most likely expiry date
        dates.sort(key=lambda x: x['confidence'], reverse=True)
        best_date = dates[0]
        
        # Check if date is in the future (likely expiry date)
        today = datetime.now()
        if best_date['date'] > today:
            return {
                "expiry_date": best_date['date'].strftime("%Y-%m-%d"),
                "confidence": best_date['confidence'],
                "pattern_found": best_date['pattern'],
                "days_until_expiry": (best_date['date'] - today).days
            }
        else:
            # Date is in the past, might be manufacturing date
            return {
                "error": "Found date is in the past",
                "found_date": best_date['date'].strftime("%Y-%m-%d"),
                "extracted_text": text[:200]
            }
            
    except Exception as e:
        return {"error": f"OCR extraction failed: {str(e)}"}

def extract_barcode(image_data):
    """Extract barcode from image"""
    try:
        # Decode base64 image
        if isinstance(image_data, str):
            image_bytes = base64.b64decode(image_data.split(',')[1])
        else:
            image_bytes = image_data
        
        img = Image.open(io.BytesIO(image_bytes))
        img_cv = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        
        # Convert to grayscale
        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        
        # Apply edge detection
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        barcodes = []
        for contour in contours:
            # Filter contours by area (barcodes are usually rectangular)
            area = cv2.contourArea(contour)
            if area > 1000:  # Minimum area threshold
                x, y, w, h = cv2.boundingRect(contour)
                aspect_ratio = w / h
                
                # Barcodes typically have high aspect ratios
                if aspect_ratio > 2.0:
                    # Extract ROI
                    roi = gray[y:y+h, x:x+w]
                    
                    # Try to decode barcode
                    try:
                        barcode_data = pytesseract.image_to_string(roi, config='--psm 7 -c tessedit_char_whitelist=0123456789')
                        barcode_data = re.sub(r'[^0-9]', '', barcode_data)
                        
                        if len(barcode_data) >= 8:  # Minimum barcode length
                            barcodes.append({
                                'code': barcode_data,
                                'confidence': 0.7,
                                'position': (x, y, w, h)
                            })
                    except:
                        continue
        
        return {
            "barcodes": barcodes,
            "count": len(barcodes)
        }
        
    except Exception as e:
        return {"error": f"Barcode extraction failed: {str(e)}"}

def extract_food_info(image_data):
    """Extract comprehensive food information from label"""
    try:
        # Extract expiry date
        expiry_result = extract_expiry_date(image_data)
        
        # Extract barcode
        barcode_result = extract_barcode(image_data)
        
        # OCR for product name and other info
        processed_img = preprocess_image_for_ocr(image_data)
        if processed_img is not None:
            text = pytesseract.image_to_string(processed_img, config='--psm 6')
            
            # Extract product name (usually the largest text)
            lines = text.split('\n')
            product_name = ""
            for line in lines:
                line = line.strip()
                if len(line) > 3 and not any(char.isdigit() for char in line):
                    product_name = line
                    break
            
            return {
                "expiry_date": expiry_result,
                "barcode": barcode_result,
                "product_name": product_name,
                "full_text": text[:500],  # First 500 chars
                "confidence": 0.6
            }
        else:
            return {
                "expiry_date": expiry_result,
                "barcode": barcode_result,
                "error": "Failed to extract text"
            }
            
    except Exception as e:
        return {"error": f"Food info extraction failed: {str(e)}"} 