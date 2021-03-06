import { useState, useEffect } from "react";
import Filter from "./components/Filter";
import PersonForm from "./components/Form";
import phoneService from "./services/Persons";
import Person from "./components/Persons";
import Notification from "./components/Notification";

const App = () => {
  const [persons, setPersons] = useState([]);
  const [addPerson, setAddPerson] = useState({ name: "", number: "" });
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState({ msg: "", status: "" });

  const copyPersons = [...persons];
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddPerson((prev) => ({ ...prev, [name]: value }));
  };

  // handle filter input change
  const handleFilterChange = (e) => {
    const value = e.target.value;
    setSearch(value);
  };

  // notify
  const notify = (msg, status) => {
    setMessage({ msg, status });
    setTimeout(() => {
      setMessage({ msg: "", status: "" });
    }, 5000);
  };

  // filtering persons
  const filterPerson =
    search.length === 0
      ? persons
      : copyPersons.filter((person) =>
          person.name.toLowerCase().includes(search.toLowerCase())
        );

  // Handles form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    // filter  existing name
    const checkPerson = persons.find(
      (person) => person.name === addPerson.name
    );
    const updatedPerson = { ...checkPerson, number: addPerson.number };

    const newPerson = {
      name: addPerson.name,
      number: addPerson.number,
      // id: persons.length + 1,
    };

    if (checkPerson) {
      const confirm = window.confirm(
        `${checkPerson.name} is already added to phonebook, replace the old number with a new one?`
      );
      if (confirm) {
        phoneService
          .update(checkPerson.id, updatedPerson)
          .then((result) => {
            setPersons(
              persons.map((person) =>
                person.id !== checkPerson.id ? person : result
              )
            );
            notify(
              `Changed "${result.name}'s" number to "${result.number}"`,
              "ok"
            );
          })
          .catch((err) => {
            notify(
              `Information of "${checkPerson.name}" has already been removed from server`
            );
            setPersons(persons.filter((p) => p.id !== checkPerson.id));
            console.log("Error in update person >>>>", err);
          });
      }
    } else {
      phoneService
        .create(newPerson)
        .then((result) => {
          setPersons(persons.concat(result));
          notify(`Added "${result.name}"`, "ok");
        })
        .catch((err) => console.log("Error in create >>>", err));
    }
    setAddPerson({ name: "", number: "" });
  };

  // Fetching initial state from json-server
  useEffect(() => {
    phoneService.getAll().then((result) => {
      setPersons(result);
    });
  }, []);

  // remove a person from the server
  const handleDelete = (id) => {
    const person = persons.find((p) => p.id === id);
    const confirm = window.confirm(`Are you you want to delete ${person.name}`);

    if (confirm) {
      phoneService
        ._delete(id)
        .then(() => {
          setPersons(persons.filter((p) => p.id !== id));
          notify(`"${person.name}" successfully deleted!`, "ok");
        })
        .catch((err) => {
          notify(`"${person.name}" was previously deleted from the server!`);
          setPersons(persons.filter((p) => p.id !== id));
          console.log("Error in delete >>>>", err);
        });
    }
  };

  return (
    <div>
      <h2>Phonebook</h2>
      <Notification message={message.msg} status={message.status} />
      <Filter search={search} handleChange={handleFilterChange} />
      <h2>Add a New</h2>
      <PersonForm
        handleSubmit={handleSubmit}
        handleChange={handleChange}
        addPerson={addPerson}
      />
      <h2>Numbers</h2>
      <div>
        {filterPerson.length > 0 ? (
          <>
            {filterPerson.map((person) => (
              <Person
                key={person.id}
                name={person.name}
                number={person.number}
                onDelete={() => handleDelete(person.id)}
              />
            ))}
          </>
        ) : (
          <p>No matches!</p>
        )}
      </div>
    </div>
  );
};

export default App;
