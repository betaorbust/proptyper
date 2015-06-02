Proptyper
=========

![I'm helping!](http://i.imgur.com/2jDRS0D.gif?1)

I can not say this enough: this is a *hack* of a script that will read in your JSX file, find props, and insert a 
Proptype block (including groundskeeper pragma) at the top of your definition.

This is just a starting point, based on reading strings. The idea is to run it on a bunch of files, and then fill
out the proptype specifics.
 
As a side note: make sure to add .isRequired in your proptypes where it makes sense. It makes the proptypes MUCH more useful in the long run.

Installing Proptyper
--------------------

The easiest way to get proptyper is via NPM

```
npm install -g betaorbust/proptyper
```

Running Proptyper
-----------------

To run Proptyper on one file, just pass that file as an option.

```
proptyper myElement.jsx
```

If you want to run it on an entire directory of JSX files, use the following:

```
find ./ -type f  -name "*.jsx" -exec proptyper {} \;
```


Gotchas
-------

The basic assumptions used are:

- There is only one React component in your JSX file.
- You access your props via `this.props.myProp`, `self.props.myProp`, or `scope.props.myProp`

This project is just meant to be a starting place, because let's face it, you haven't been keeping up with proptypes, and you could use a hand.