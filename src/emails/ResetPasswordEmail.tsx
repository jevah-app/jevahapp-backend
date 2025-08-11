import React from "react";

interface ResetPasswordEmailProps {
  firstName: string;
  resetLink: string;
}

export const ResetPasswordEmail: React.FC<ResetPasswordEmailProps> = ({
  firstName,
  resetLink,
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
                Reset Your Password, {firstName || "User"}!
              </h1>
              <p
                style={{
                  fontSize: "16px",
                  color: "#6B7280",
                  margin: "0",
                }}
              >
                Let's get you back into your Tevah account.
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
                You requested to reset your password. Click the button below to
                set a new password:
              </p>
              <a
                href={resetLink}
                style={{
                  display: "inline-block",
                  backgroundColor: "#FF5733",
                  color: "#FFFFFF",
                  padding: "12px 24px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontSize: "16px",
                  fontWeight: "600",
                  margin: "20px 0",
                }}
              >
                Reset Password
              </a>
              <p
                style={{
                  fontSize: "14px",
                  color: "#6B7280",
                  margin: "20px 0",
                }}
              >
                This link will expire in 1 hour. If you didn’t request a
                password reset, please ignore this email or contact{" "}
                <a
                  href="mailto:support@tevahapp.com"
                  style={{ color: "#FF5733", textDecoration: "none" }}
                >
                  support@tevahapp.com
                </a>
                .
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
              <p style={{ margin: "0" }}>© 2025 Tevah. All rights reserved.</p>
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
