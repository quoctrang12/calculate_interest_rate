import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import App from "../App";
import { HomePage } from "../pages";
import WeddingPage from "../pages/wedding";

export default function MainRoute(){

    return (
        <BrowserRouter >
            <Routes >
                <Route path="/" element={<App/>}>
                    <Route path="/" element={<HomePage/>} />
                    <Route path="/*" element={<Navigate to={"/"}/>} />
                </Route>
                <Route path="/wedding" element={<WeddingPage/>} />
            </Routes>
        </BrowserRouter>
    )
}