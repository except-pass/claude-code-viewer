import { redirect } from "next/navigation";
import { pagesPath } from "../lib/$path";

export default function Home() {
  redirect(pagesPath.projects.$url().pathname);
}
