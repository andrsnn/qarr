import React from 'react';

import Timer from './Timer';

export class Run extends React.Component {
    constructor() {
        super();
        this.state = {
            playVideo: false,
            totalTime: 25,
            numRounds: 5,
            warmUpTime: 3,
            coolDownTime: 1,
            video: '',
            isRunning: false,
            rounds: [],
            text: ''
        };
        this.submit = this.submit.bind(this);
        this.handleDefault = this.handleDefault.bind(this);
        this.handleStart = this.handleStart.bind(this);
        this.runTimer = this.runTimer.bind(this);
        this.nextStage = this.nextStage.bind(this);

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
            totalTime, src, warmUpTime, coolDownTime
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
    handleStart() {

        let { totalTime, numRounds, warmUpTime, coolDownTime } = this.state;

        totalTime = parseInt(totalTime);
        numRounds = parseInt(numRounds);
        warmUpTime = parseInt(warmUpTime);
        coolDownTime = parseInt(coolDownTime);

        console.log(totalTime, numRounds, warmUpTime, coolDownTime)

        // should do this when the data is input oh well
        if (isNaN(totalTime) || isNaN(numRounds) || isNaN(warmUpTime) || isNaN(coolDownTime)) {
            throw new Error();
            // window.location.reload();
        }

        const rounds = [];

        const timeWithoutWarmUp = totalTime - warmUpTime;

        const amountOfCoolDownTime = coolDownTime * numRounds;

        const tt = timeWithoutWarmUp - amountOfCoolDownTime;

        const timePerRound = Math.floor(tt / numRounds);

        rounds.push({
            name: 'Warm Up',
            time: warmUpTime
        })

        for (let i = 0; i < numRounds; i++) {
            rounds.push({
                name: 'Round ' + (i + 1),
                time: timePerRound
            });
            rounds.push({
                name: 'Round ' + (i + 1) + ' Cool Down',
                time: coolDownTime
            });
        }

        this.setState({ isRunning: true, rounds }, this.runTimer)
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
                    {
                        !this.state.isRunning ?
                        <button onClick={this.handleStart}>Start</button> :
                        <h2 onClick={this.nextStage}>{this.state.text}</h2>
                    }
            </div>
            </div>
            
        )
    }
}