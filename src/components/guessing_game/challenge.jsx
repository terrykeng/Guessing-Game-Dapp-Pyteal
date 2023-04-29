import React, {useState,} from "react";
import {toast} from "react-toastify";
import Loader from "../utils/Loader";
import {NotificationError, NotificationSuccess} from "../utils/Notifications";
import PropTypes from "prop-types";
import {Button} from "react-bootstrap";
import { TextBoxComponent } from '@syncfusion/ej2-react-inputs';
import {create_challenge} from "../../utils/guessingame";
import {useNavigate} from 'react-router-dom';

const Challenge = ({address, fetchBalance, appid}) => {
    const [wager, setwager] = useState(0);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate()



    if (loading) {
	    return <Loader/>;
	}
    return (
        <>
        <h1>Player1</h1>
        <h2>Appid: {appid}</h2>
         <div className="textboxes" style={{ display:"flex" , justifycontent:"center", alignitem:"center" ,margin: "0 auto", width: "12%"}}>
                <TextBoxComponent  placeholder="Enter wager" floatLabelType="Auto" onChange={(e) => {
                                    setwager(e.target.value)
                                }}/>
            </div>
            <div style={{ display:"flex" , justifycontent:"center", alignitem:"center"}}>
            <Button 
                    onClick={() => {
                        let data = {wager}
                        if(wager >= 0.5 ){
                            create_challenge(address,data)
                            .then(() => {
                                toast(<NotificationSuccess text="Challenge created sucessfully."/>);
                                fetchBalance(address);
                                navigate('/play')
                            })
                            .catch(error => {
                                console.log(error);
                                toast(<NotificationError text="Creating challenge was unsucessfull."/>);
                                setLoading(false);
                            })
                        }else{
                            toast(<NotificationError text="Wager must be 0.5algo and above."/>);
                        }
                    }}
                    color='blue'
                    className="rounded-pill px-0"
                    style={{ margin: "0 auto", width: "10%"}}>
                        Enter
            </Button>
            </div>
        
        </>    
    );
};

Challenge.propTypes = {
    address: PropTypes.string.isRequired,
    fetchBalance: PropTypes.func.isRequired,
};

export default Challenge;