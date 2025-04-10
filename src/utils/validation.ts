
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const checkPasswordStrength = (password: string): {
  score: number;
  feedback: string;
} => {
  // Password strength criteria
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  // Calculate score (0-4)
  let score = 0;
  if (hasMinLength) score++;
  if (hasUpperCase) score++;
  if (hasLowerCase) score++;
  if (hasNumbers) score++;
  if (hasSpecialChars) score++;

  // Provide feedback based on score
  let feedback = "";
  if (score === 0) feedback = "Very weak";
  else if (score === 1) feedback = "Weak";
  else if (score === 2) feedback = "Fair";
  else if (score === 3) feedback = "Good";
  else if (score === 4) feedback = "Strong";
  else feedback = "Very strong";

  return { score, feedback };
};
