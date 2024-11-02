import { Input } from "antd";
import { FC, useState } from "react";
import CurrencyInput from "react-currency-input-field";

export const HomePage: FC = () => {
  const [inputAmount, setInputAmount] = useState<{
    amountLens: string;
    amountFee: string;
    months: string;
  }>({amountLens:"",amountFee:"",months: ""});

  return (
    <div className="w-100 text-center" style={{minHeight: "100vh" }}>
      <h1 className="fw-bold mt-5 text-uppercase">Tính tiền lãi ngân hàng </h1>

      <div className="w-75 mx-auto text-start" style={{marginTop: "5vh"}}>

        <label className="text-start">Số tiền gốc</label>
      <CurrencyInput
        className="form-control"
        placeholder="Nhập số tiền gốc"
        suffix=" VND"
        value={inputAmount.amountLens}
        onValueChange={(value) => {
          setInputAmount((e) => ({ ...e, amountLens: value || "" }));
        }}
      />
      <label className="text-start">Lãi suất (%)</label>

<Input
  className="form-control"
  type="currency"
  placeholder="Nhập lãi suất"
  value={inputAmount.amountFee}
  onChange={(value) => {
    setInputAmount((e) => ({ ...e, amountFee: value.target.value || "" }));
  }}
/>
        {/* <label className="text-start">Số tiền lãi</label>

      <CurrencyInput
        className="form-control"
        placeholder="Số tiền lãi"
        suffix=" VND"
        disabled
        decimalScale={0}
        value={+inputAmount.amountFee?.replace(",", ".")/100*(+inputAmount.amountLens) || ""}
      /> */}
        <label className="text-start">Kỳ hạn (Tháng)</label>

      <Input
        className="form-control"
        placeholder="Nhập số kỳ hạn"
        type="tel"
        value={inputAmount.months}
        onChange={(value) => {
          setInputAmount((e) => ({ ...e, months: value.target.value || "" }));
        }}
      />
        <label className="text-start">Số tiền phải trả / tháng</label>
      <CurrencyInput
        className="form-control result"
        disabled
        suffix=" VND/Tháng"
        decimalScale={0}
        value={
          inputAmount.amountLens &&
          inputAmount.amountFee &&
          inputAmount.months &&
          (+inputAmount.amountLens + ((+inputAmount.amountFee?.replace(",", ".")/100)*(+inputAmount.amountLens)*(+inputAmount.months/12) )) /
            +inputAmount.months + (1000-((+inputAmount.amountLens + ((+inputAmount.amountFee?.replace(",", ".")/100)*(+inputAmount.amountLens)*(+inputAmount.months/12) )) /
            +inputAmount.months)%1000)
        }
      />
      <button className="btn btn-danger w-100 mt-2" onClick={()=>{setInputAmount({amountLens:"",amountFee:"",months: ""})}}>Xóa tất cả</button>
      </div>
      
    </div>
  );
};
