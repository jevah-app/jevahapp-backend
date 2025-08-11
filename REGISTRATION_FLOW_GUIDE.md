# Registration Flow Guide - Normal Users vs Artists

## 🔄 **Smart Registration Flow**

When a user tries to register as an artist through the normal registration endpoint, the system now intelligently redirects them to the proper artist registration flow.

## 📱 **React Native Implementation**

### **1. Normal User Registration (Existing Flow)**

```javascript
// Your existing React Native code - NO CHANGES NEEDED
const registerNormalUser = async (userData) => {
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        desiredRole: userData.role, // "learner", "parent", "educator", etc.
      }),
    });

    const data = await response.json();

    if (data.success) {
      // Normal registration successful
      console.log("User registered:", data.user);
      // Navigate to email verification
      navigation.navigate("EmailVerification");
    } else {
      // Handle error
      console.error("Registration failed:", data.message);
    }
  } catch (error) {
    console.error("Network error:", error);
  }
};
```

### **2. Artist Registration (New Flow)**

```javascript
// New artist registration flow
const registerArtist = async (artistData) => {
  try {
    const formData = new FormData();
    formData.append("email", artistData.email);
    formData.append("password", artistData.password);
    formData.append("firstName", artistData.firstName);
    formData.append("lastName", artistData.lastName);
    formData.append("artistName", artistData.artistName); // REQUIRED
    formData.append("genre[]", artistData.genre[0]); // REQUIRED
    formData.append("genre[]", artistData.genre[1]);
    formData.append("bio", artistData.bio);
    formData.append("socialMedia[instagram]", artistData.instagram);
    formData.append("socialMedia[youtube]", artistData.youtube);
    formData.append("recordLabel", artistData.recordLabel);
    formData.append("yearsActive", artistData.yearsActive.toString());

    if (artistData.avatar) {
      formData.append("avatar", artistData.avatar);
    }

    const response = await fetch("/api/auth/artist/register", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      // Artist registration successful
      console.log("Artist registered:", data.artist);
      // Navigate to email verification
      navigation.navigate("EmailVerification");
    } else {
      // Handle error
      console.error("Artist registration failed:", data.message);
    }
  } catch (error) {
    console.error("Network error:", error);
  }
};
```

### **3. Smart Registration Handler**

```javascript
// Smart registration that handles both flows
const handleRegistration = async (userData) => {
  try {
    // First, try normal registration
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (data.success) {
      // Normal registration successful
      console.log("User registered:", data.user);
      navigation.navigate("EmailVerification");
    } else if (data.redirectToArtistRegistration) {
      // User selected artist role - redirect to artist registration
      console.log("Redirecting to artist registration...");

      // Show artist registration form
      setShowArtistForm(true);
      setArtistRegistrationInfo(data);

      // Or navigate to artist registration screen
      navigation.navigate("ArtistRegistration", {
        userData: userData,
        requiredFields: data.requiredArtistFields,
        optionalFields: data.optionalArtistFields,
      });
    } else {
      // Other error
      console.error("Registration failed:", data.message);
      setError(data.message);
    }
  } catch (error) {
    console.error("Network error:", error);
    setError("Network error occurred");
  }
};
```

## 🎯 **Registration Flow Scenarios**

### **Scenario 1: Normal User Registration**

```javascript
// User data
const userData = {
  email: "user@example.com",
  password: "password123",
  firstName: "John",
  lastName: "Doe",
  desiredRole: "learner" // or "parent", "educator", etc.
};

// Result: Direct registration
{
  "success": true,
  "message": "User registered successfully. Please verify your email.",
  "user": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "learner"
  }
}
```

### **Scenario 2: Artist Role Selected in Normal Registration**

```javascript
// User data
const userData = {
  email: "artist@example.com",
  password: "password123",
  firstName: "Gospel",
  lastName: "Artist",
  desiredRole: "artist" // This triggers redirect
};

// Result: Redirect to artist registration
{
  "success": false,
  "message": "Artist registration requires additional information",
  "redirectToArtistRegistration": true,
  "artistRegistrationEndpoint": "/api/auth/artist/register",
  "requiredArtistFields": ["artistName", "genre"],
  "optionalArtistFields": ["bio", "socialMedia", "recordLabel", "yearsActive", "avatar"]
}
```

### **Scenario 3: Direct Artist Registration**

```javascript
// Artist data
const artistData = {
  email: "artist@example.com",
  password: "password123",
  firstName: "Gospel",
  lastName: "Artist",
  artistName: "Gospel John",
  genre: ["gospel", "worship"],
  bio: "A passionate gospel artist",
  socialMedia: {
    instagram: "@gospeljohn",
    youtube: "GospelJohnMusic"
  },
  recordLabel: "Heavenly Records",
  yearsActive: 5
};

// Result: Direct artist registration
{
  "success": true,
  "message": "Artist registered successfully. Please verify your email.",
  "artist": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "email": "artist@example.com",
    "firstName": "Gospel",
    "lastName": "Artist",
    "role": "artist",
    "artistProfile": {
      "artistName": "Gospel John",
      "genre": ["gospel", "worship"],
      "bio": "A passionate gospel artist",
      "socialMedia": {
        "instagram": "@gospeljohn",
        "youtube": "GospelJohnMusic"
      },
      "recordLabel": "Heavenly Records",
      "yearsActive": 5,
      "isVerifiedArtist": false
    }
  }
}
```

## 🎨 **UI Flow Recommendations**

### **Option 1: Single Registration Form with Smart Detection**

```javascript
// One form that handles both cases
const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    desiredRole: "learner",
  });

  const [showArtistFields, setShowArtistFields] = useState(false);

  const handleRoleChange = (role) => {
    setFormData({ ...formData, desiredRole: role });
    setShowArtistFields(role === "artist");
  };

  const handleSubmit = async () => {
    if (formData.desiredRole === "artist") {
      // Use artist registration
      await registerArtist(formData);
    } else {
      // Use normal registration
      await registerNormalUser(formData);
    }
  };

  return (
    <View>
      {/* Basic fields */}
      <TextInput placeholder="Email" value={formData.email} />
      <TextInput placeholder="Password" value={formData.password} />
      <TextInput placeholder="First Name" value={formData.firstName} />
      <TextInput placeholder="Last Name" value={formData.lastName} />

      {/* Role selection */}
      <Picker
        selectedValue={formData.desiredRole}
        onValueChange={handleRoleChange}
      >
        <Picker.Item label="Learner" value="learner" />
        <Picker.Item label="Parent" value="parent" />
        <Picker.Item label="Educator" value="educator" />
        <Picker.Item label="Content Creator" value="content_creator" />
        <Picker.Item label="Gospel Artist" value="artist" />
      </Picker>

      {/* Artist-specific fields (shown only when artist selected) */}
      {showArtistFields && (
        <View>
          <TextInput placeholder="Artist Name" value={formData.artistName} />
          <TextInput placeholder="Genre" value={formData.genre} />
          <TextInput placeholder="Bio" value={formData.bio} />
          {/* More artist fields */}
        </View>
      )}

      <Button title="Register" onPress={handleSubmit} />
    </View>
  );
};
```

### **Option 2: Separate Registration Screens**

```javascript
// Two separate registration screens
const RegistrationScreen = () => {
  return (
    <View>
      <Text>Choose your registration type:</Text>
      <Button
        title="Register as User"
        onPress={() => navigation.navigate("UserRegistration")}
      />
      <Button
        title="Register as Artist"
        onPress={() => navigation.navigate("ArtistRegistration")}
      />
    </View>
  );
};
```

## ✅ **Benefits of This Approach**

1. **Backward Compatible**: Your existing React Native code works unchanged
2. **Smart Detection**: Automatically detects when user wants artist registration
3. **Clear Guidance**: Provides specific information about required artist fields
4. **Flexible UI**: Can implement either single form or separate screens
5. **Error Prevention**: Prevents incomplete artist registrations

## 🎯 **Summary**

- **Normal User Registration**: Works exactly as before
- **Artist Role Selection**: Automatically redirects to artist registration
- **Direct Artist Registration**: Separate endpoint for complete artist signup
- **Smart Response**: API provides guidance for artist registration requirements

Your React Native developer can implement this flow however they prefer - the backend handles all the logic intelligently!
