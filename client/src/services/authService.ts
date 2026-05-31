export interface LoginResponse {
  userName: string;
  token: string;
}

export async function login(password: string): Promise<LoginResponse> {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    throw new Error("Login failed");
  }

  return response.json();
}

export function saveAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("raywitAuthToken", token);
  }
}

export function getAuthToken(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("raywitAuthToken") || "";
  }
  return "";
}

export function clearAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("raywitAuthToken");
  }
}
