import React from "react";

interface WelcomeEmailProps {
  firstName: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({ firstName }) => {
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
                Welcome to Tevah, {firstName || "User"}!
              </h1>
              <p
                style={{
                  fontSize: "16px",
                  color: "#6B7280",
                  margin: "0",
                }}
              >
                We're thrilled to have you on board.
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
                Get started on your learning journey with Tevah. Explore our
                platform, connect with others, and unlock new opportunities.
              </p>
              <a
                href="https://tevahapp.com/dashboard"
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
                Explore Tevah
              </a>
              <p
                style={{
                  fontSize: "14px",
                  color: "#6B7280",
                  margin: "20px 0 0",
                }}
              >
                Need help? Contact us at{" "}
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
