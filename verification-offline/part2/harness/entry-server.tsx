import * as React from "react";
import { renderToString } from "react-dom/server";
import Page from "@/app/page";
import * as fs from "fs";
fs.writeFileSync(process.argv[2], renderToString(React.createElement(Page)));
