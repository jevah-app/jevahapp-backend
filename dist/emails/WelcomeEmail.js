"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WelcomeEmail = void 0;
const react_1 = __importDefault(require("react"));
const WelcomeEmail = ({ firstName }) => {
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
                            "Welcome to Tevah, ",
                            firstName || "User",
                            "!"),
                        react_1.default.createElement("p", { style: {
                                fontSize: "16px",
                                color: "#6B7280",
                                margin: "0",
                            } }, "We're thrilled to have you on board.")),
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
                            } }, "Get started on your learning journey with Tevah. Explore our platform, connect with others, and unlock new opportunities."),
                        react_1.default.createElement("a", { href: "https://tevahapp.com/dashboard", style: {
                                display: "inline-block",
                                backgroundColor: "#FF5733",
                                color: "#FFFFFF",
                                padding: "12px 24px",
                                borderRadius: "6px",
                                textDecoration: "none",
                                fontSize: "16px",
                                fontWeight: "600",
                                margin: "20px 0",
                            } }, "Explore Tevah"),
                        react_1.default.createElement("p", { style: {
                                fontSize: "14px",
                                color: "#6B7280",
                                margin: "20px 0 0",
                            } },
                            "Need help? Contact us at",
                            " ",
                            react_1.default.createElement("a", { href: "mailto:support@tevahapp.com", style: { color: "#FF5733", textDecoration: "none" } }, "support@tevahapp.com"),
                            ".")),
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
exports.WelcomeEmail = WelcomeEmail;
