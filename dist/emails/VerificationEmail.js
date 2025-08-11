"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationEmail = void 0;
const react_1 = __importDefault(require("react"));
const VerificationEmail = ({ firstName, code, }) => {
    return (react_1.default.createElement("div", { style: {
            backgroundColor: "#F6F8FA",
            padding: "40px 20px",
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            color: "#1A1A1A",
            lineHeight: "1.5",
        } },
        react_1.default.createElement("table", { width: "100%", cellPadding: "0", cellSpacing: "0", style: { maxWidth: "600px", margin: "0 auto" } },
            react_1.default.createElement("tr", null,
                react_1.default.createElement("td", null,
                    react_1.default.createElement("div", { style: {
                            backgroundColor: "#FFFFFF",
                            borderRadius: "8px 8px 0 0",
                            padding: "30px",
                            textAlign: "center",
                            borderBottom: "1px solid #E5E7EB",
                        } },
                        react_1.default.createElement("h1", { style: {
                                fontSize: "28px",
                                fontWeight: "700",
                                color: "#1A1A1A",
                                margin: "0 0 10px",
                            } },
                            "Verify Your Email, ",
                            firstName || "User",
                            "!"),
                        react_1.default.createElement("p", { style: {
                                fontSize: "16px",
                                color: "#6B7280",
                                margin: "0",
                            } }, "You're one step away from joining Tevah.")),
                    react_1.default.createElement("div", { style: {
                            backgroundColor: "#FFFFFF",
                            padding: "30px",
                            borderRadius: "0 0 8px 8px",
                            textAlign: "center",
                        } },
                        react_1.default.createElement("p", { style: {
                                fontSize: "16px",
                                color: "#1A1A1A",
                                margin: "0 0 20px",
                            } }, "Please use the following code to verify your email address:"),
                        react_1.default.createElement("div", { style: {
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
                            } }, code),
                        react_1.default.createElement("p", { style: {
                                fontSize: "14px",
                                color: "#6B7280",
                                margin: "20px 0",
                            } },
                            "This code will expire in 10 minutes. If you need a new code,",
                            " ",
                            react_1.default.createElement("a", { href: "https://tevahapp.com/resend-verification", style: { color: "#FF5733", textDecoration: "none" } }, "request one here"),
                            "."),
                        react_1.default.createElement("p", { style: {
                                fontSize: "16px",
                                color: "#1A1A1A",
                                margin: "20px 0 0",
                            } }, "Thank you for joining Tevah!")),
                    react_1.default.createElement("div", { style: {
                            textAlign: "center",
                            padding: "20px 0",
                            fontSize: "12px",
                            color: "#6B7280",
                        } },
                        react_1.default.createElement("p", { style: { margin: "0" } }, "\u00A9 2025 Tevah. All rights reserved."),
                        react_1.default.createElement("p", { style: { margin: "5px 0 0" } },
                            react_1.default.createElement("a", { href: "https://tevahapp.com/privacy", style: { color: "#FF5733", textDecoration: "none" } }, "Privacy Policy"),
                            " ",
                            "|",
                            " ",
                            react_1.default.createElement("a", { href: "https://tevahapp.com/terms", style: { color: "#FF5733", textDecoration: "none" } }, "Terms of Service"))))))));
};
exports.VerificationEmail = VerificationEmail;
