import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import App from "../App";
import { HomePage } from "../pages";

export default function MainRoute(){

    return (
        <BrowserRouter >
            <Routes >
                <Route path="/" element={<App/>}>
                    <Route path="/" element={<HomePage/>} />
                    <Route path="/*" element={<Navigate to={"/"}/>} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}