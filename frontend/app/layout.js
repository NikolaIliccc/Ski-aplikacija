import "./globals.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Providers from "./providers";

export const metadata = {
  title: "Ski School Booking",
  description: "Ski school booking app"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
