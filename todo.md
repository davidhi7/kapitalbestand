# Frontend
## Notification
* Schatten bei slide-in / slide-out des Notification Elements
* ruckartig verringerte Breite bei erstem Notification slide-in
* Notification slideout beginnt nach Ablauf der Timeout Duration auch wenn timeout animation durch hover verzögert wird
* Easing optimieren

## Form
* sum input field: set maximum input value reasonable
* transcation form controller: error when fetch fails due to no connection to the server
* differentiate between optional and required fields

## Liste
* Spaltenbreiten
* expand: key und value ausgewählt bei Doppelklick auf Werte
* gelöschte Transaktion direkt entfernen von Liste
* Ändern erlauben

## Allgemein
* Formattierungsfunktionen für Text hinzufügen

# Backend
* validation of monthly transaction monthFrom and monthTo / if monthFrom == monthTo, validation error is thrown: monthFrom is allegedly greater than monthTo
* set reasonable datatype and validation for large 'amount' input values
* API unit testing
* Think about session store / session secret store
