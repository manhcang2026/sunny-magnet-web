#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Build a production-ready, bilingual (EN/VI) landing page for "Sunny Magnet",
  a custom photo magnet business. Warm sunny yellow/orange palette, mobile-first,
  sections: Hero (with image slider), Feature/Gallery, Pricing with
  "Buy 10 Get 1 Free" promo, How it Works (3 steps), and a bottom lead-capture
  form (Full Name, Phone, Shipping Address, Referral Code) that can forward to
  a Google Apps Script webhook.

backend:
  - task: "POST /api/leads persists lead to MongoDB (+optional GAS webhook forward)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Implemented POST /api/leads with fullName, phone, address, referralCode, quantity, notes, language. Validates fullName+phone. Stores in Mongo 'leads' collection with UUID id. Forwards to GAS_WEBHOOK_URL if env var set, else returns webhookStatus='not_configured'. Manual curl test passed (success:true)."
      - working: true
        agent: "testing"
        comment: "✅ ALL TESTS PASSED. Validated: (1) Returns 400 for missing fullName or phone, (2) Successfully creates leads with UUID id and ISO createdAt timestamp, (3) Sets source='landing_page' correctly, (4) Returns webhookStatus='not_configured' when GAS_WEBHOOK_URL not set, (5) Bilingual support works (tested with language='en' and 'vi'), (6) Extra unknown fields are safely ignored and not stored, (7) All lead data persists correctly to MongoDB. Test file: /app/backend_test.py"
  - task: "GET /api/health and GET /api/leads listing"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Health endpoint returns {ok:true}. GET /api/leads returns latest 100 leads without _id."
      - working: true
        agent: "testing"
        comment: "✅ ALL TESTS PASSED. Validated: (1) GET /api/health returns {ok:true, service:'sunny-magnet'}, (2) GET /api (root) returns {ok:true, service:'sunny-magnet'}, (3) GET /api/leads returns {leads:[...]} array with leads sorted by most recent first, (4) No MongoDB _id field in response items, (5) OPTIONS /api/leads returns 204 with proper CORS headers, (6) Posted leads appear correctly in GET /api/leads list. Test file: /app/backend_test.py"

frontend:
  - task: "Sunny Magnet landing page rendering (Hero, Features, Gallery, Pricing, How, Form, Footer)"
    implemented: true
    working: "NA"
    file: "app/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Full landing page built with EN/VI language toggle, hero with auto-changing image slider, pricing tiers with Buy 10 Get 1 Free callout, 3-step How it Works, and a beautiful lead capture form. Sticky mobile CTA. Verified via screenshot."
  - task: "Magnet Studio - bulk upload, per-image cropper (zoom/rotate/pan), AI-like filters, configured counter, hand-off to order form"
    implemented: true
    working: "NA"
    file: "components/magnet-studio.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Built Magnet Studio: multi-file upload (drag&drop + tap), gallery of realistic square magnet mockups with metallic frame, per-image Editor modal (zoom 1x-3x, rotate -180/+180, drag-to-pan with pointer events, 5 filters: Original/Auto-Enhance/Brighten/Vibrant/Pastel Pop). Live configured count, Buy10Get1 free promo unlock, clicking Use these scrolls to order form and pre-fills the quantity. Fully client-side."
      - working: "NA"
        agent: "main"
        comment: "MAJOR OVERHAUL of the Design magnet editor: (1) Print-accurate 70x70mm crop area with a visible 65x65mm safe-zone mask + dimmed 2.5mm bleed edge + rounded corner outline + info tooltip 'Phần rìa mờ sẽ được gấp ra mặt sau...'. (2) Full manual controls: pan (single-finger drag), pinch-to-zoom with two fingers, two-finger rotate, wheel-zoom on desktop, plus Zoom & Rotate sliders. (3) Adjustment sliders: Brightness, Contrast, White Balance (warmth). (4) Prominent AI Auto-Enhance button that reads image histogram (128x128 sample) and auto-computes brightness/contrast/warmth. (5) Save renders a full-res 826x826 (70mm@300DPI) JPEG blob via canvas 2D ctx.filter and stores it on the item as outputBlob + outputUrl for later upload to GAS/Drive. Grid preview now shows the baked 65x65 visible region if saved. Bilingual EN+VI."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus: []
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "MVP landing page built. Backend leads endpoint saves to MongoDB and can forward to GAS webhook when GAS_WEBHOOK_URL env var is set. Please test the backend endpoints (POST /api/leads validation + persistence, GET /api/leads listing, GET /api/health)."
  - agent: "testing"
    message: "✅ Backend testing complete - ALL 9 TESTS PASSED! Tested: GET /api/health, GET /api (root), OPTIONS /api/leads (CORS), POST /api/leads validation (400 errors), POST /api/leads success (English & Vietnamese), extra fields handling, GET /api/leads listing (sorted, no _id), and verified posted leads appear in list. All endpoints working correctly. UUID generation, ISO timestamps, source field, webhookStatus, bilingual support, and data persistence all validated. Backend is production-ready."
