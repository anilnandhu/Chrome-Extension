from flask import Flask,request, jsonify
from pyresparser import ResumeParser
import tempfile
import os 
from flasgger import Swagger


app = Flask(__name__)
Swagger(app)


@app.route('/parse_resume', methods=['POST'])
def parse_resume():
    """
    Parse a resume and user fields.
    ---
    consumes:
      - multipart/form-data
    parameters:
      - name: name
        in: formData
        type: string
      - name: email
        in: formData
        type: string
      - name: phone
        in: formData
        type: string
      - name: experience
        in: formData
        type: string
      - name: resume
        in: formData
        type: file
        required: true
    responses:
      200:
        description: Resume parsed and merged
        schema:
          type: object
    """
    # ... your existing code ...

    user_fields = {
        'name' : request.form.get('name'),
        'email' : request.form.get('email'),
        'phone' : request.form.get('phone'),    
        'experience' : request.form.get('experience'),
    }
    uploaded_file = request.files.get('resume')

    if not uploaded_file:
        return jsonify({"error" : "No Resume file uploaded"}),400
    
    temp_path = ''
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            uploaded_file.save(temp_file.name)
            temp_path = temp_file.name
        
        parser = ResumeParser(temp_path)
        data = parser.get_extracted_data()
        del parser

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)

    for key,val in user_fields.items():
        if val:
            data[key] = val

    return jsonify(data),200

if __name__ == '__main__':
    app.run(debug=True,port=8000)
