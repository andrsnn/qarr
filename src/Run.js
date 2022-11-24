import React from 'react';

import Timer from './Timer';
import { CountdownCircleTimer } from 'react-countdown-circle-timer'

import "./CircleTimerStyles.css"

const renderTime = ({remainingTime}, round, totalTime, totalElapsed) => {
    if (remainingTime === 0) {
      return (
        <div>
        <div className="text">{totalElapsed}/{totalTime}</div>
        <div className="text">Done!</div>
        </div>
      );
    }
  
    return (
      <div className="timer">
        <div className="text">{round.name}</div>
        <div className="text">Remaining</div>
        <div className="value">{remainingTime}</div>
        <div className="text">seconds</div>
      </div>
    );
  };

const quartile = (num) => {
    return [
        num,
        Math.floor(num * .75),
        Math.floor(num * .25),
        0
    ]
}

export class Run extends React.Component {
    constructor() {
        super();
        this.state = {
            playVideo: false,
            isPlaying: false,
            totalTime: 25,
            numRounds: 5,
            warmUpTime: 3,
            coolDownTime: 1,
            video: '',
            isRunning: false,
            rounds: [],
            round: null,
            totalElapsed: 0,
            text: ''
        };
        this.submit = this.submit.bind(this);
        this.handleDefault = this.handleDefault.bind(this);
        this.handleStart = this.handleStart.bind(this);
        this.runTimer = this.runTimer.bind(this);
        this.nextStage = this.nextStage.bind(this);
        this.onComplete = this.onComplete.bind(this);
    }
    submit(e) {
        e.preventDefault();

        const elems = e.target.elements;

        const totalTime = elems.totalTime.value;
        const src = elems.src.value;
        const warmUpTime = elems.warmUpTime.value;
        const coolDownTime = elems.coolDownTime.value;

        if (!totalTime || !src || !warmUpTime || !coolDownTime) {
            window.location.reload();
        }

        this.setState({
            totalTime, video: src, warmUpTime, coolDownTime, playVideo: true
        })
    }
    handleDefault(options) {
        this.setState(Object.assign({}, this.state, { playVideo: true }, options));
    }
    nextStage() {
        if (this.timer) {
            this.timer.clear();
            this.runTimer();
        }
    }
    runTimer() {

        const round = this.state.rounds.shift();

        if (!round) {
            window.location.reload();
            return;
        }

        const {time, name} = round;

        const timer = new Timer({count: time * 60});
        this.timer = timer;

        timer.end = () => {
            this.runTimer();
        }
        timer.tick = (count) => {
            this.setState({ 
                text: name + ': ' + count
            })
        }

        this.setState({
            rounds: this.state.rounds
        }, () => timer.start())
    }
    onComplete() {
        setTimeout(() => {
            this.setState({ isPlaying: false}, () => {

                const round = this.state.rounds.shift();

                if (!round) {
                    window.location.reload();
                    return;
                }
        
                this.setState({ round, isPlaying: true, totalElapsed: this.state.totalElapsed + round.time });
            })

        }, 3000);
    }
    handleStart() {

        let { totalTime, numRounds, warmUpTime, coolDownTime } = this.state;

        totalTime = parseInt(totalTime);
        numRounds = parseInt(numRounds);
        warmUpTime = parseInt(warmUpTime);
        coolDownTime = parseInt(coolDownTime);

        console.log(totalTime, numRounds, warmUpTime, coolDownTime)

        // should do this when the data is input oh well
        if (isNaN(totalTime) || isNaN(numRounds) || isNaN(warmUpTime) || isNaN(coolDownTime)) {
            window.location.reload();
        }

        const rounds = [];

        const timeWithoutWarmUp = totalTime - warmUpTime;

        const amountOfCoolDownTime = coolDownTime * numRounds;

        const tt = timeWithoutWarmUp - amountOfCoolDownTime;

        const timePerRound = Math.floor(tt / numRounds);

        rounds.push({
            name: 'Warm Up',
            time: warmUpTime,
            quartiles: quartile(warmUpTime)
        })

        for (let i = 0; i < numRounds; i++) {
            rounds.push({
                name: 'Round ' + (i + 1),
                time: timePerRound,
                quartiles: quartile(timePerRound)
            });
            rounds.push({
                name: 'Round ' + (i + 1) + ' Cool Down',
                time: coolDownTime,
                quartiles: quartile(coolDownTime)
            });
        }

        const round = rounds.shift();

        this.setState({ isRunning: true, rounds, round, isPlaying: true, totalElapsed: round.time })
    }
    render() {

        if (!this.state.playVideo) {
            return (
                <div>
                    <div>
                        <form onSubmit={this.submit}>
                            <label htmlFor="src">Video URL</label>
                            <input name="src"></input>
                            <br/>
                            <label htmlFor="totalTime">Total Time (minutes)</label>
                            <input name="totalTime" defaultValue={25}></input>
                            <br/>
                            <label htmlFor="numRounds">Number of Rounds (not including warm up)</label>
                            <input name="numRounds" defaultValue={4}></input>
                            <br/>
                            <label htmlFor="warmUpTime">Warm Up Time</label>
                            <input name="warmUpTime" defaultValue={3}></input>
                            <br/>
                            <label htmlFor="coolDownTime">Cool Down Time</label>
                            <input name="coolDownTime" defaultValue={1}></input>
                            <br/>
                            <button type="submit">Submit</button>
                        </form>
                    </div>
                    <br/>
                    <div>
                        <form>
                            <button type="button" onClick={this.handleDefault.bind(this, {video: 'https://www.youtube.com/embed/MqildI0Gz0g'})}>NY Running</button>
                            <button type="button">Two</button>
                        </form>
                    </div>
                
                </div>
            )
        }

        return (
            <div>
                <div className="wrap">
                    <iframe
                        src={this.state.video}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen>
                        </iframe>
                </div>

                <div className="overlay">
                    <div onClick={this.pause}>
                    {
                        !this.state.isRunning ?
                        <button onClick={this.handleStart}>Start</button> :
                        this.state.isPlaying ?
                        <CountdownCircleTimer
                            isPlaying={this.state.isPlaying}
                            duration={this.state.round.time}
                            size={300}
                            colors={["#004777", "#F7B801", "#A30000", "#A30000"]}
                            colorsTime={this.state.round.quartiles}
                            onComplete={() => this.onComplete()}
                            >
                        {(time) => renderTime(time, this.state.round, this.state.totalTime, this.state.totalElapsed)}
                        </CountdownCircleTimer> : null
                    }
                    
                    </div>
                </div>
            </div>
            
        )
    }
}