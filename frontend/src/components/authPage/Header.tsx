import { Typography } from "@mui/material";
import { Link } from "react-router-dom";

interface Props {
  heading: string;
  paragraph: string;
  linkName: string;
  linkUrl: string;
}

export default function Header({
  heading,
  paragraph,
  linkName,
  linkUrl = "#",
}: Props) {

  return (
    <div className="mb-3">
      <div className={`w-20 h-20 mx-auto logo`}></div>
      <Typography variant={"h4"} className="mt-6 text-center text-3xl font-extrabold">
        {heading}
      </Typography>
      <Typography className="text-center text-sm mt-5">
        {paragraph}
        <Link
          to={linkUrl}
          className="font-medium ml-2"
          style={{ color: "#5f2eea" }}
        >
          {linkName}
        </Link>
      </Typography>
    </div>
  );
}
