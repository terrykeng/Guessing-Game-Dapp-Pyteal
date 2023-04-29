import React, {useState} from "react";
import {toast} from "react-toastify";
import Loader from "../utils/Loader";
import {NotificationError, NotificationSuccess} from "../utils/Notifications";
import PropTypes from "prop-types";
import {Button} from "react-bootstrap";
import { TextBoxComponent } from '@syncfusion/ej2-react-inputs';
import {play,p1wins,p2wins,draws,reveal} from "../../utils/guessingame";
import { NavLink} from 'react-router-dom';

const Playreveal = ({address, fetchBalance}) => {
    const [move, setmove] = useState(0);
    const [loading, setLoading] = useState(false);

    if (loading) {
	    return <Loader/>;
	}

    return (
        <>
         <div className="textboxes" style={{ display:"flex" , justifycontent:"center", alignitem:"center" ,margin: "0 auto", width: "12%"}}>
                <TextBoxComponent  placeholder="Enter Guess" floatLabelType="Auto" onChange={(e) => {
                                    setmove(e.target.value)
                                }}/>
            </div>
            <div style={{ display:"flex" , justifycontent:"flex-start", alignitem:"left"}}>
            <Button 
                    onClick={() => {
                        let data = {move}
                        play(address, data)
                        .then(() => {
                            toast(<NotificationSuccess text="Play was sucessful."/>);
                            fetchBalance(address);
                        })
                        .catch(error => {
                            console.log(error);
                            toast(<NotificationError text="Making play was unsucessfull."/>);
                            setLoading(false);
                        })
                       
                    }}
                    color='green'

                    className="rounded-pill px-0"
                    style={{ margin: "10px auto", width: "10%"}}>
                        play
            </Button>
            </div>
            
            
            <div style={{ display:"flex" , justifycontent:"flex", alignitem:"left"}}>
            <Button 
                    onClick={() => {
                        reveal(address)
                            .then(() => {
                                if(p1wins === 1){
                                    toast(<NotificationSuccess text=" Player 1 Won"/>);
                                    fetchBalance(address);

                                }
                                else if(p2wins === 1){
                                    toast(<NotificationSuccess text=" Player 2 Won"/>);
                                    fetchBalance(address);
                                }
                                else if (draws === 1){
                                    toast(<NotificationSuccess text=" Nobody Won"/>);
                                    fetchBalance(address);
                                }
                                
                            })
                            .catch(error => {
                                console.log(error);
                                toast(<NotificationError text="Error occured."/>);
                                setLoading(false);
                            })
                        
                    }}
                    color='green'
                    className="rounded-pill px-0"
                    style={{ margin: "10px auto", width: "10%"}}>
                        Reveal winner
            </Button>
            </div>
            <NavLink to='/'>
            <div style={{ display:"flex" , justifycontent:"center", alignitem:"left"}}>
            <Button 
                    background-color='green'
                    className="rounded-pill px-0"
                    style={{ margin: "10px auto", width: "10%"}}>
                        Restart
            </Button>
            </div>
            </NavLink>


        <h4>Game rules</h4>
        <p>1 Both players are to guess a random number from 1 to 10 in one round</p>
        <p>2 The winner takes all</p>
        <p>3 Incase of a draw the wager would be returned to each of the player and the game can be restarted</p>



        {/* <h5>Player1_count:{p1wins}</h5>     
        <h5>Player2_count:{p2wins}</h5>
        <h5>Draw_count:{draws}</h5> */}
            
        </>    
    );
};

Playreveal.propTypes = {
    address: PropTypes.string.isRequired,
    fetchBalance: PropTypes.func.isRequired,
};

export default Playreveal;