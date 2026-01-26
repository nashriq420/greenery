
# 1. Unregistered Email
echo "Testing Unregistered Email..."
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"nonexistent@example.com\", \"password\": \"password123\"}"
echo -e "\n"

# 2. Invalid Password
# Assuming seller2@greenery.com exists and has password 'password123' (from logs)
echo "Testing Invalid Password..."
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"seller2@greenery.com\", \"password\": \"wrongpassword\"}"
echo -e "\n"

# 3. Suspended Account
# seller2@greenery.com was seen as suspended/rejected in logs
echo "Testing Suspended Account..."
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"seller2@greenery.com\", \"password\": \"password123\"}"
echo -e "\n"

# 4. Pending Account
# Create a new user first
echo "Creating Pending User..."
TIMESTAMP=$(date +%s)
NEW_EMAIL="pending_user_${TIMESTAMP}@example.com"
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$NEW_EMAIL\", \"password\": \"password123\", \"name\": \"Pending User\", \"role\": \"CUSTOMER\"}"
echo -e "\n"

echo "Testing Pending Account Login..."
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$NEW_EMAIL\", \"password\": \"password123\"}"
echo -e "\n"
