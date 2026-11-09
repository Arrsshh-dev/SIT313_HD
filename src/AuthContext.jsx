import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [subscription, setSubscription] = useState("free");
  const [isAdmin, setIsAdmin] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      setCurrentUser(user);
      setUserProfile(null);
      setSubscription("free");
      setIsAdmin(false);
      setTwoFactorEnabled(false);

      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const userRef = doc(db, "users", user.uid);

      unsubscribeProfile = onSnapshot(
        userRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const profile = snapshot.data();

            setUserProfile(profile);
            setSubscription(
              String(profile.subscription || "free").toLowerCase()
            );
            setIsAdmin(
              profile.role === "admin" || profile.isAdmin === true
            );
            setTwoFactorEnabled(profile.twoFactorEnabled === true);
          } else {
            setUserProfile(null);
            setSubscription("free");
            setIsAdmin(false);
            setTwoFactorEnabled(false);
          }

          setLoading(false);
        },
        (error) => {
          console.error("Error loading user profile:", error);
          setUserProfile(null);
          setSubscription("free");
          setIsAdmin(false);
          setTwoFactorEnabled(false);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  async function logout() {
    await signOut(auth);
  }

  const value = {
    currentUser,
    userProfile,
    subscription,
    isAdmin,
    twoFactorEnabled,
    loading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
