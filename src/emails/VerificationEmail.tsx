import React from "react";

interface VerificationEmailProps {
  firstName: string;
  code: string;
}

export const VerificationEmail: React.FC<VerificationEmailProps> = ({
  firstName,
  code,
}) => {
  return (
    <div
      style={{
        backgroundColor: "#F6F8FA",
        padding: "40px 20px",
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        color: "#1A1A1A",
        lineHeight: "1.5",
      }}
    >
      <table
        width="100%"
        cellPadding="0"
        cellSpacing="0"
        style={{ maxWidth: "600px", margin: "0 auto" }}
      >
        <tr>
          <td>
            {/* Header */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "8px 8px 0 0",
                padding: "30px",
                textAlign: "center",
                borderBottom: "1px solid #E5E7EB",
              }}
            >
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "#1A1A1A",
                  margin: "0 0 10px",
                }}
              >
                Verify Your Email, {firstName || "User"}!
              </h1>
              <p
                style={{
                  fontSize: "16px",
                  color: "#6B7280",
                  margin: "0",
                }}
              >
                You're one step away from joining Tevah.
              </p>
            </div>

            {/* Content */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                padding: "30px",
                borderRadius: "0 0 8px 8px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: "16px",
                  color: "#1A1A1A",
                  margin: "0 0 20px",
                }}
              >
                Please use the following code to verify your email address:
              </p>
              <div
                style={{
                  backgroundColor: "#F3F4F6",
                  display: "inline-block",
                  padding: "15px 30px",
                  borderRadius: "6px",
                  fontSize: "24px",
                  fontWeight: "600",
                  color: "#1A1A1A",
                  letterSpacing: "2px",
                  fontFamily: '"Courier New", Courier, monospace',
                  margin: "20px 0",
                }}
              >
                {code}
              </div>
              <p
                style={{
                  fontSize: "14px",
                  color: "#6B7280",
                  margin: "20px 0",
                }}
              >
                This code will expire in 10 minutes. If you need a new code,{" "}
                <a
                  href="https://tevahapp.com/resend-verification"
                  style={{ color: "#FF5733", textDecoration: "none" }}
                >
                  request one here
                </a>
                .
              </p>
              <p
                style={{
                  fontSize: "16px",
                  color: "#1A1A1A",
                  margin: "20px 0 0",
                }}
              >
                Thank you for joining Tevah!
              </p>
            </div>

            {/* Footer */}
            <div
              style={{
                textAlign: "center",
                padding: "20px 0",
                fontSize: "12px",
                color: "#6B7280",
              }}
            >
              <p style={{ margin: "0" }}>
                &copy; 2025 Tevah. All rights reserved.
              </p>
              <p style={{ margin: "5px 0 0" }}>
                <a
                  href="https://tevahapp.com/privacy"
                  style={{ color: "#FF5733", textDecoration: "none" }}
                >
                  Privacy Policy
                </a>{" "}
                |{" "}
                <a
                  href="https://tevahapp.com/terms"
                  style={{ color: "#FF5733", textDecoration: "none" }}
                >
                  Terms of Service
                </a>
              </p>
            </div>
          </td>
        </tr>
      </table>
    </div>
  );
};
