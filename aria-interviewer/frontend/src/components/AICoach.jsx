import { Navigate } from "react-router-dom";

/**
 * AICoach has been superseded by the CareerCoachPage.
 * This component now simply redirects to the canonical route.
 */
export default function AICoach() {
  return <Navigate to="/career-coach" replace />;
}